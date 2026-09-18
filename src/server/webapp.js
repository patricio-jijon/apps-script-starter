export const doGet = (e) => {
  const view = e && e.parameter && e.parameter.view === 'staff' ? 'admin.html' : 'index.html';
  const title = view === 'admin.html' ? 'NYC FIRST · D3 Field Trips Staff' : 'D3 STEM Field Trips';
  return HtmlService.createHtmlOutputFromFile(view)
    .setTitle(title)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);
};