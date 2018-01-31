function onOpen() {
  var ui = SpreadsheetApp.getUi();
  // Or DocumentApp or FormApp.
  ui.createMenu('Practice Actions')
      .addItem('Send me lesson plan', 'generatePlan')
      .addItem('Run Setup', 'setup')
      .addToUi();
}
