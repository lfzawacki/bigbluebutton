import Auth from '/imports/ui/services/auth';
import { trace } from '@opentelemetry/api';
const tracer = trace.getTracer('react-client');
import getFromUserSettings from '/imports/ui/services/users-settings';

function shouldInstrument(componentName) {
  const OTEL_CONFIG = window.meetingClientSettings.public.otel;

  if (OTEL_CONFIG?.react?.enabled) {
    const included = OTEL_CONFIG.react.includeComponents;
    const excluded = OTEL_CONFIG.react.excludedComponents;
    return included.length && included.includes(componentName) || excluded.length && !excluded.includes(componentName);
  }
  return false;
}

export default function withRenderInstrumentation(Component, name) {

  if (shouldInstrument(name)) {
    console.log("not instrumenting", name);
    return Component;
  } else {
    console.log("intrument", name);
  }

  return function Wrapped(props) {
    const span = tracer.startSpan(`${name}-render`);
    span.setAttribute("bbb.meeting.id", Auth.meetingID);
    span.setAttribute("bbb.user.id", Auth.userID);

    let element;
    try {
      element = <Component {...props} />;
    } finally {
      requestAnimationFrame(() => {
        span.end();
      });
    }

    return element;
  };
}
