import { resourceFromAttributes, defaultResource } from '@opentelemetry/resources';
import { SEMRESATTRS_SERVICE_NAME } from "@opentelemetry/semantic-conventions";
import {
  SimpleSpanProcessor,
  WebTracerProvider,
} from "@opentelemetry/sdk-trace-web";
import { metrics, trace } from "@opentelemetry/api";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { FetchInstrumentation } from "@opentelemetry/instrumentation-fetch";
import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { DocumentLoadInstrumentation } from "@opentelemetry/instrumentation-document-load";
import {
  MeterProvider,
  PeriodicExportingMetricReader,
} from "@opentelemetry/sdk-metrics";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http/build/src/platform/browser";

import getFromUserSettings from '/imports/ui/services/users-settings';

const shouldInstrumentComponent = () => {
  return false;
};

const shouldInstrumentConnection = () => {
  return false;
};

const setupOTelSDK = () => {
  const OTEL_CONFIG = window.meetingClientSettings.public.otel;

  if (!OTEL_CONFIG.enabled) {
    return false
  }

  const resource = resourceFromAttributes({
    [SEMRESATTRS_SERVICE_NAME]: OTEL_CONFIG.serviceName,
    host: window.location.host,
  });

  const traceExporter = new OTLPTraceExporter({
    url: OTEL_CONFIG.traceUrl,
    headers: {},
  });

  const spanProcessor = new SimpleSpanProcessor(traceExporter);

  const tracerProvider = new WebTracerProvider({
    resource: resource,
    spanProcessors: [new SimpleSpanProcessor(traceExporter)]
  });

  const metricExporter = new OTLPMetricExporter({
    url: OTEL_CONFIG.metricUrl,
    headers: {},
  });
  const metricReader = new PeriodicExportingMetricReader({
    exporter: metricExporter,
    exportIntervalMillis: 60000,
  });

  const meterProvider = new MeterProvider({
    resource: resource,
    readers: [metricReader],
  });

  metrics.setGlobalMeterProvider(meterProvider);

  tracerProvider.register();
  trace.setGlobalTracerProvider(tracerProvider);

  registerInstrumentations({
    instrumentations: [
      new DocumentLoadInstrumentation(),
    ],
  });
};

export { setupOTelSDK, shouldInstrumentComponent, shouldInstrumentConnection };
