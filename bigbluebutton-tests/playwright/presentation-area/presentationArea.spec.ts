import type { APIRequestContext, Browser, BrowserContext, Page as PlaywrightPage, TestInfo } from '@playwright/test';

import { test } from '../core/setup/fixtures';
import {
  CONTENT_LABELS,
  CORE_CONTENTS,
  MEDIA_AREA_CONTENTS,
  type MediaAreaContent,
  PresentationArea,
} from './presentationArea';

const needsPlugin = (...contents: MediaAreaContent[]) => contents.includes('pluginContent');

// Every kind of content that takes over the presentation area must behave the same way: the last
// one shared wins and stops the previous one, and stopping it brings the whiteboard back
test.describe.parallel('Presentation area content', { tag: ['@ci', '@media'] }, () => {
  test.beforeEach(({ browserName }) => {
    test.skip(browserName === 'firefox', 'Screenshare tests not able in Firefox browser without desktop');
  });

  type Fixtures = { browser: Browser; page: PlaywrightPage; context: BrowserContext; request: APIRequestContext };

  // Creates the meeting (with the stubbed plugin when the case needs one) and joins the presenter
  const init = async ({ browser, page, context, request }: Fixtures, testInfo: TestInfo, withPlugin: boolean) => {
    const presentationArea = new PresentationArea(browser, context);
    const createParameter = withPlugin ? await presentationArea.stubPlugin(context, request) : undefined;
    await presentationArea.initModPage(page, { testInfo, createParameter });
    return presentationArea;
  };

  test.describe('Sharing replaces the current content', () => {
    MEDIA_AREA_CONTENTS.forEach((next) => {
      CORE_CONTENTS.filter((previous) => previous !== next).forEach((previous) => {
        test(`Sharing the ${CONTENT_LABELS[next]} stops the ${CONTENT_LABELS[previous]}`, async ({
          browser,
          page,
          context,
          request,
        }, testInfo) => {
          const presentationArea = await init(
            {
              browser,
              page,
              context,
              request,
            },
            testInfo,
            needsPlugin(next),
          );
          await presentationArea.replaces(next, previous);
        });
      });
    });
  });

  test.describe('Stopping the current content', () => {
    MEDIA_AREA_CONTENTS.forEach((content) => {
      test(`Stopping the ${CONTENT_LABELS[content]} brings the whiteboard back`, async ({
        browser,
        page,
        context,
        request,
      }, testInfo) => {
        const presentationArea = await init(
          {
            browser,
            page,
            context,
            request,
          },
          testInfo,
          needsPlugin(content),
        );
        await presentationArea.stopBringsWhiteboardBack(content);
      });
    });
  });

  test.describe('Core content over plugin content', () => {
    CORE_CONTENTS.forEach((core) => {
      test(`The plugin content comes back when the ${CONTENT_LABELS[core]} shown over it stops`, async ({
        browser,
        page,
        context,
        request,
      }, testInfo) => {
        const presentationArea = await init(
          {
            browser,
            page,
            context,
            request,
          },
          testInfo,
          true,
        );
        await presentationArea.coversPluginContent(core);
      });
    });

    test('Re-rendering the plugin content with a new id keeps the screenshare', async ({
      browser,
      page,
      context,
      request,
    }, testInfo) => {
      const presentationArea = await init(
        {
          browser,
          page,
          context,
          request,
        },
        testInfo,
        true,
      );
      await presentationArea.pluginRerenderKeepsCoreContent('screenshare');
    });

    test('Re-rendering the plugin content with a new id keeps the pinned shared notes', async ({
      browser,
      page,
      context,
      request,
    }, testInfo) => {
      const presentationArea = await init(
        {
          browser,
          page,
          context,
          request,
        },
        testInfo,
        true,
      );
      await presentationArea.pluginRerenderKeepsCoreContent('pinnedNotes');
    });

    test('The presenter reloading keeps the pinned shared notes over the plugin content', async ({
      browser,
      page,
      context,
      request,
    }, testInfo) => {
      const presentationArea = await init(
        {
          browser,
          page,
          context,
          request,
        },
        testInfo,
        true,
      );
      await presentationArea.presenterReloadKeepsCoreContent('pinnedNotes');
    });

    test('The presenter reloading keeps the external video over the plugin content', async ({
      browser,
      page,
      context,
      request,
    }, testInfo) => {
      const presentationArea = await init(
        {
          browser,
          page,
          context,
          request,
        },
        testInfo,
        true,
      );
      await presentationArea.presenterReloadKeepsCoreContent('externalVideo');
    });
  });

  test('Opening the camera as content view without sharing keeps the screenshare', async ({
    browser,
    page,
    context,
    request,
  }, testInfo) => {
    const presentationArea = await init(
      {
        browser,
        page,
        context,
        request,
      },
      testInfo,
      false,
    );
    await presentationArea.cameraPickerCancelKeepsScreenshare();
  });

  test('Viewers follow every replacement of the presentation area content', async ({
    browser,
    context,
    page,
  }, testInfo) => {
    const presentationArea = new PresentationArea(browser, context);
    await presentationArea.initModPage(page, { testInfo });
    await presentationArea.initUserPage(context, { testInfo });
    await presentationArea.viewerFollowsReplacements();
  });
});
