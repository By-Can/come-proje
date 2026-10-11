import * as cheerio from 'cheerio';

export function sanitizeHtml(htmlContent) {
  if (!htmlContent) return htmlContent;

  const $ = cheerio.load(htmlContent);

  // Remove/redact password inputs
  $('input[type="password"]').each((i, el) => {
    $(el).attr('value', '[REDACTED]');
  });

  // Remove/redact hidden CSRF/token values
  $('input[type="hidden"]').each((i, el) => {
    const name = ($(el).attr('name') || '').toLowerCase();
    const id = ($(el).attr('id') || '').toLowerCase();
    const isSensitive = ['csrf', 'xsrf', 'token', 'session'].some(key => name.includes(key) || id.includes(key));
    if (isSensitive) {
      $(el).attr('value', '[REDACTED]');
    }
  });

  // Remove/redact CSRF <meta> tags
  $('meta').each((i, el) => {
    const name = ($(el).attr('name') || '').toLowerCase();
    const isSensitive = ['csrf', 'xsrf', 'token'].some(key => name.includes(key));
    if (isSensitive) {
      $(el).attr('content', '[REDACTED]');
    }
  });

  // Ensure no inline script execution or form submissions occur in the parsed tree
  // Though cheerio is passive, we'll actively remove <script> and form actions to make the HTML safer if rendered
  $('script').remove();
  $('form').removeAttr('action');

  return $.html();
}
