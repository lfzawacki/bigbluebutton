import { ApolloLink } from '@apollo/client';
import { trace } from '@opentelemetry/api';
import Auth from '/imports/ui/services/auth';
import getFromUserSettings from '/imports/ui/services/users-settings';
const OTEL_CONFIG = window.meetingClientSettings.public.otel;

const telemetryLink = new ApolloLink((operation, forward) => {
  const tracer = trace.getTracer('graphql-ws-tracer');

  console.log('operation: ', operation, operation.getContext());

  const span = tracer.startSpan(`graphql.${operation.operationName || 'anonymous'}`, {
    attributes: {
      'graphql.operationName': operation.operationName,
      'graphql.type': operation.query.definitions
        .filter((d) => 'operation' in d)
        .map((d) => d.operation)
        .join(','),
      'graphql.variables': JSON.stringify(operation.variables),
      'bbb.user.id': Auth.userID as string || '',
      'bbb.meeting.id': Auth.meetingID as string || '',
    },
  });

  span.addEvent('request_sent');

  const observable = forward(operation);

  return observable.map((result) => {
    span.addEvent('response_received', {
      size: JSON.stringify(result).length,
    });

    span.end();
    return result;
  });
});

export default telemetryLink;
