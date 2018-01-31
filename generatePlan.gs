function generatePlan() {
  var maximumReviewItems = 5;
  var minutesPerReviewItem = 7;
  var minutesPerTechnique = 15;


  var maxTechniques = 2;
  var maxTunes = 1;
  var day = 24*3600*1000;
  var today = Math.ceil((new Date().setHours(0,0,0,0))/day);
  var yesterday = today - 1;
  var email = Session.getActiveUser().getEmail();

  function generateForm(){
    var reviewItems = getReviewItems("Technique - Mastered").concat(getReviewItems("Tunes - Mastered"));
    var techniqueItems = getItems("Technique", maxTechniques)
    var tuneItems = getItems("Tunes", maxTunes)
    //This block removes old sheets to keep the response spreadsheet from overflowing
    var ss = SpreadsheetApp.getActiveSpreadsheet()
    var sheetsCount = ss.getNumSheets();
    var sheets = ss.getSheets();
    var i=sheetsCount-1;
    while (i >=0)
    {
      var name = sheets[i].getName()
      if ( sheets[i].getName().indexOf("Form Responses") != -1) {
        var sheet = sheets[i];
        var formUrl = sheet.getFormUrl();
        if(formUrl){
          var fm = FormApp.openByUrl(formUrl);
          fm.removeDestination();
        }
        ss.deleteSheet(sheets[i]);
      }
      i--;
    }

    var form = FormApp.create('Today\'s Practice Plan');
    form.setDestination(FormApp.DestinationType.SPREADSHEET, SpreadsheetApp.getActiveSpreadsheet().getId());
    SpreadsheetApp.flush();

    form.addSectionHeaderItem()
    .setTitle('Estimated Time - ' + (((reviewItems.length * minutesPerReviewItem) + (techniqueItems.length * minutesPerTechnique) + 45)) + " minutes");

    form.addSectionHeaderItem()
    .setTitle('Ear Training - 15 minutes')
    .setHelpText("https://web.meludia.com/en/game/");

    if(reviewItems.length){
      form.addSectionHeaderItem()
      .setTitle('Review - ' + (reviewItems.length * minutesPerReviewItem) + ' minutes');
      for (var i=0; i < reviewItems.length; i++) {
        form.addParagraphTextItem()
        .setTitle((reviewItems[i].type == 'tune' ? '#tune# - ': '') + reviewItems[i].title)
        .setHelpText(reviewItems[i].url + '\n'+ reviewItems[i].helpText);
      }
    }

    if(techniqueItems.length){
      form.addSectionHeaderItem()
      .setTitle('Techniques - ' + (techniqueItems.length * minutesPerTechnique) + ' minutes')
      for (var i=0; i < techniqueItems.length; i++) {
        form.addParagraphTextItem()
        .setTitle(techniqueItems[i].title)
        .setHelpText((techniqueItems[i].level ? "LEVEL: " + techniqueItems[i].level + "\n" : "") + techniqueItems[i].url + '\n' + techniqueItems[i].helpText);
        form.addScaleItem()
        .setTitle('Rate this skill - '+ techniqueItems[i].title)
        .setBounds(0, 5);
      }
    }

    if(tuneItems.length){
      form.addSectionHeaderItem()
      .setTitle('Tune - 15 minutes ')
      for (var i = 0; i < tuneItems.length; i++) {
        form.addParagraphTextItem()
        .setTitle("#tune# - " + tuneItems[i].title)
        .setHelpText((tuneItems[i].level ? "LEVEL: " + tuneItems[i].level + "\n" : "") + tuneItems[i].url +  '\n' + tuneItems[i].helpText)
        form.addScaleItem()
        .setTitle('Rate this skill - #tune# - ' + tuneItems[i].title)
        .setBounds(0, 5);
      }
    }

    form.addSectionHeaderItem()
    .setTitle('Creative - 15 minutes')

    form.addSectionHeaderItem()
    .setTitle('Bonus')
    .setHelpText("https://www.soundslice.com/licks/")

    form.addTextItem()
    .setTitle('Practice Duration');

    var puburl = form.getPublishedUrl();
    MailApp.sendEmail(email, "Today's Practice Plan", "Good day friend! I present you today's custom practice plan:\n"+puburl);
  }

  function getReviewItems(sheetName)
  {
    var type = sheetName == "Tunes - Mastered" ? 'tune' : 'technique';
    var reviewItems = []
    var nextPracticeDateColumn = 7
    var lastPracticedDateColumn = nextPracticeDateColumn-1
    var helpColumn = 2;
    var reviewCountColumn = 8;
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    var lastPracticedDateColumnValues = sheet.getRange(2, lastPracticedDateColumn, sheet.getLastRow()).getValues();

    // This block accomodates skip days and missed exercises
    for (var i=0; i < lastPracticedDateColumnValues.length; i++) {
      var lastPracticedDate = lastPracticedDateColumnValues[i][0];
      if(isDate(lastPracticedDate)){
        var lastPracticedDay = parseInt(lastPracticedDate.getTime()/day);
        var reviewCount = sheet.getRange(i+2, reviewCountColumn).getValue();
        var nextReviewDay = getNextReviewDate(lastPracticedDay, reviewCount)
        var nextReviewDate = new Date(nextReviewDay * day)
        sheet.getRange(i + 2, nextPracticeDateColumn).setValue(nextReviewDate);
        if(reviewItems.length < maximumReviewItems){
          if (nextReviewDay === today){
            if(reviewItems.length < maximumReviewItems){
              var title = sheet.getRange(i + 2, 1).getValues()[0][0];
              var addItem = true;
              for (var j=0; j < reviewItems.length; j++) {
                if(reviewItems[j].title === title){
                  addItem = false
                }
              }
              var helpText = sheet.getRange(i + 2, helpColumn).getValues()[0][0];
              var formula = sheet.getRange(i + 2, 1).getFormula();
              var url = "";
              if(formula){
                url = formula.match(/=hyperlink\("([^"]+)"/i)[1];
              }
              if(addItem) {
                reviewItems.push({title: title, url:url, helpText: helpText, type: type});
              }
            }
          }
        }
      }
    }
    return reviewItems
  }

  function getItems(sheetName, count){
    var items = []
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    var itemsRows = sheet.getRange(2, 1, 4).getValues(); //1st is header
    var pickEven = today % 2 == 0;
    for (var i=0; i < itemsRows.length; i++) {
      var title = itemsRows[i][0];
      if(items.length < count) {
        var level  = sheet.getRange(i + 2, 3).getValues()[0][0];
        var formula = sheet.getRange(i + 2, 1).getFormula();
        var helpText = sheet.getRange(i + 2, 2).getValues()[0][0];
        var url = "";
        if(formula){
          url = formula.match(/=hyperlink\("([^"]+)"/i)[1];
        }
        if(i % 2 == 0){
          if(pickEven){
            items.push({title: title, level:level, url:url, helpText:helpText});
          }
        } else {
          if(!pickEven){
            items.push({title: title, level:level, url:url, helpText:helpText});
          }
        }
      }
    }
    return items;
  }

  function getReviewIntervalFromCount(reviewCount) {
    switch (reviewCount) {
      case 0:
        return 1
      case 1:
        return 3
      case 2:
        return 10
      case 3:
        return 30
      case 4:
        return 60
      case 5:
        return 90
      default:
        return 90
    }
  }

  function getNextReviewDate(lastPracticed, reviewCount){
    var timeSinceLastPractice = today - lastPracticed
    var interval = getReviewIntervalFromCount(reviewCount)
    if (timeSinceLastPractice < interval) {
      return lastPracticed + interval
    } else {
      return today
    }
  }

  function isDate(v) {
    if (Object.prototype.toString.call(v) === "[object Date]") {
        if (isNaN(v.getTime())) {
            return false;
        } else {
            return true;
        }
    } else {
        return false;
    }
  }
  // Start the whole thing
  generateForm()
}

