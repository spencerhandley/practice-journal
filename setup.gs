function setup() {
  function setUpTriggers() {
    var ss = SpreadsheetApp.getActive();
    ScriptApp.newTrigger('onOpen')
    .forSpreadsheet(ss)
    .onOpen()
    .create();
    ScriptApp.newTrigger('onFormSubmit')
    .forSpreadsheet(ss)
    .onFormSubmit()
    .create();
    ScriptApp.newTrigger('generatePlan')
    .timeBased()
    .atHour(6)
    .everyDays(1)
    .create();
  }
  var email = Session.getActiveUser().getEmail();
  MailApp.sendEmail(
    email, 
    "Practice Sheet is Set up!",
    "Congratulations, you're all set, happy practicing!"
    );
  setUpTriggers()
}


