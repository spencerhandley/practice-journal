function onFormSubmit(e) {
  var today = new Date()
  var todaysDate = (today.getMonth() + 1) + "/" + (today.getDate()) + "/" + today.getFullYear()
  var selectedTune;
  var lastPracticedColumn = 6;
  var initialMasteryDateColumn = 5;
  var spacedRepetitionColumn = 7;
  var reviewCountColumn = 8;
  var startedDateColumn = 4;
  var ratingColumn = 3;
  var notesColumn = 2;
  var titleColumn = 1;
  var dailyLog = "";
  
  function updateItem(sheetName, item){
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    var masteredSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName + " - Mastered");
    SpreadsheetApp.flush();
    var deleteRows = []
    if(item.inProgress) {
      var columnValues = sheet.getRange(2, titleColumn, sheet.getLastRow()).getValues();
      for (var i=0; i < columnValues.length; i++) {
        var val = columnValues[i][0];
        if(val == item.title){
          sheet.getRange(i + 2, lastPracticedColumn).setValue(todaysDate);
          var startedDate = sheet.getRange(i + 2, startedDateColumn).getValue()
          if(!startedDate){
            sheet.getRange(i + 2, startedDateColumn).setValue(todaysDate);
          }
          dailyLog += item.title + " \n ";
          if(item.helpText && item.helpText[0]) {
            sheet.getRange(i + 2, notesColumn).setValue(item.helpText);
            dailyLog += "- "+ item.helpText + " \n ";
          }
          var rating = item.rating
          if (rating > 0){
            sheet.getRange(i + 2, ratingColumn).setValue(rating);
          }
          if(rating == 5){
            sheet.getRange(i + 2, initialMasteryDateColumn).setValue(todaysDate);
            sheet.getRange(i + 2, reviewCountColumn).setValue(0);
            var masteredRow = masteredSheet.getLastRow() + 1
            var masteredRange = masteredSheet.getRange(masteredRow, 1)
            sheet.getRange(i + 2,1,1, 12).moveTo(masteredRange)
            deleteRows.push(i + 2)
          }
        }
      }
      for (var i=0; i < deleteRows.length; i++) {
        sheet.deleteRow(deleteRows[i])
      }
    } else {
      var columnValues = masteredSheet.getRange(2, titleColumn, masteredSheet.getLastRow()).getValues();
      for (var i=0; i < columnValues.length; i++) {
        var val = columnValues[i][0];
        if(val == item.title){
          masteredSheet.getRange(i + 2, lastPracticedColumn).setValue(todaysDate);
          dailyLog += item.title + " \n ";
          if(item.helpText && item.helpText[0]) {
            masteredSheet.getRange(i + 2, notesColumn).setValue(item.helpText);
            dailyLog += "- "+ item.helpText + " \n ";
          }
          var previousReviewCount = masteredSheet.getRange(i + 2, reviewCountColumn).getValue();
          masteredSheet.getRange(i + 2, reviewCountColumn).setValue(previousReviewCount+1)
        }
      }
    }
  }
  
  var itemsObject = {}
  
  function addToItemsObject(key, e, type){
    if(key.indexOf("Rate this skill -") != -1){
      var strippedItem = key.slice(18)
      var selectedItem = type == "tune" ? strippedItem.slice(9) : strippedItem;
      if(itemsObject[selectedItem]){
        itemsObject[selectedItem].rating = e.namedValues[key];
        itemsObject[selectedItem].inProgress = true
      } else {
        itemsObject[selectedItem] = {title: selectedItem, rating: e.namedValues[key], type: type, inProgress: true};
      }
    } else {
      var selectedItem = type == "tune" ? key.slice(9) : key
      if(itemsObject[selectedItem]){
        itemsObject[selectedItem].helpText = e.namedValues[key];
      } else {
        itemsObject[selectedItem] = {title: selectedItem, helpText: e.namedValues[key], type: type};
      }
    }
  }
  
  for (var key in e.namedValues){
    if(key.indexOf('#tune#') != -1){
      addToItemsObject(key, e, "tune")
    } else {
      addToItemsObject(key, e, "technique")
    }
  }
  
  for (var key in itemsObject){
    if(itemsObject[key].type == 'tune'){
      updateItem('Tunes', itemsObject[key]);
    } else {
      updateItem('Technique', itemsObject[key]);
    }
  }
  
  
  var logSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Daily Log");
  logSheet.appendRow([todaysDate, e.namedValues['Practice Duration'][0], 'Solo', dailyLog, '', '']);
  var email = Session.getActiveUser().getEmail();
  logSheet.getRange(3, 8).setValue(todaysDate);
  MailApp.sendEmail(email, "Logged your latest practice session!",
                    "Successfully processed your latest practice sesh! \n\nHere's a summary: \nDuration: "+e.namedValues['Practice Duration'][0]+"\n\n" + dailyLog
                   );
}
