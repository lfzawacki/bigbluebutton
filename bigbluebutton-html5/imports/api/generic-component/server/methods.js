import { Meteor } from 'meteor/meteor';
import startGenericComponent from './methods/startComponent';
import stopGenericComponent from './methods/stopComponent';
import postGenericComponentResults from './methods/postComponentResults';

Meteor.methods({
  startGenericComponent,
  stopGenericComponent,
  postGenericComponentResults,
});
