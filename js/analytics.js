
var ga_service, ga_tracker, previous, currentChoice, previousChoice;
var ga_timer_full_session, ga_timer_to_connect;

function startApp() {
  // Initialize the Analytics ga_service object with the name of your app.
  ga_service = analytics.getService('capacita_connection_manager');

  // Get a ga_Tracker using your Google Analytics app Tracking ID.
  ga_tracker = ga_service.getTracker('UA-26973573-3');

  // Start timing...
  var ga_timer_full_session = ga_tracker.startTiming('Session duration', 'Send Event');
  var ga_timer_to_connect = ga_tracker.startTiming('Time to connect', 'Send Event');
  // Record an "appView" each time the user launches your app or goes to a new
  // screen within the app.
  ga_tracker.sendAppView('MainWindow');



  // setupAnalyticsListener();
}



window.onload = startApp;


chrome.app.window.onClosed.addListener(function(){
  //send elapsed time
  ga_timer_full_session.send();
})