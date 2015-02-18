
var ga_service, ga_tracker, previous, currentChoice, previousChoice;
var ga_timer_full_session, ga_timer_to_connect;

function startApp() {
  // Initialize the Analytics ga_service object with the name of your app.
  ga_service = analytics.getService('capacita_connection_manager');

  // Get a ga_Tracker using your Google Analytics app Tracking ID.
  ga_tracker = ga_service.getTracker('UA-26973573-2');

  // Start timing...
  var ga_timer_full_session = ga_tracker.startTiming('Session duration', 'Send Event');
  var ga_timer_to_connect = ga_tracker.startTiming('Time to connect', 'Send Event');
  // Record an "appView" each time the user launches your app or goes to a new
  // screen within the app.
  ga_tracker.sendAppView('MainWindow');



  // setupAnalyticsListener();
}

/**
 * Adds a filter that captures hits being sent to Google Analytics.
 * Filters are useful for keeping track of what's happening in your app...
 * you can show this info in a debug panel, or log them to the console.
 */
// function setupAnalyticsListener() {
//   // Listen for event hits of the 'Flavor' category, and record them.
//   previous = [];
//   tracker.addFilter(
//       analytics.filters.FilterBuilder.builder().
//           whenHitType(analytics.HitTypes.EVENT).
//           whenValue(analytics.Parameters.EVENT_CATEGORY, 'Flavor').
//           whenValue(analytics.Parameters.EVENT_ACTION, 'Choose').
//           applyFilter(
//               function(hit) {
//                 previous.push(
//                     hit.getParameters().get(analytics.Parameters.EVENT_LABEL));
//               }).
//           build());
// }

window.onload = startApp;


chrome.app.window.onClosed.addListener(function(){
  //send elapsed time
  ga_timer_full_session.send();
})