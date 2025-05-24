export const regexes = [
  '\\[(?<timestamp>\\d{1,2}/\\d{1,2}/\\d{2,4},\\s\\d{1,2}:\\d{2}:\\d{2}\\s(?:AM|PM))\\]\\s(?<user>[^:]+):\\s(?<message>.*)',
  '(?<timestamp>\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2})\\s<(?<user>[^>]+)>\\s(?<message>.*)',
  '(?<timestamp>\\d{4}-\\d{2}-\\d{2},\\s\\d{1,2}:\\d{2}\\s[ap]\\.?m\\.?)\\s-\\s(?<user>[^:]+):\\s(?<message>.*)',
  '\\{\\s*"sender_name":\\s*"(?<user>[^"]+)",\\s*"timestamp_ms":\\s*(?<timestamp>\\d+),\\s*"content":\\s*"(?<message>(?:[^"\\\\]|\\\\.)*)"',
  '(?<user>[A-Za-z ]+)\\n(?<message>.*?)\\n(?<timestamp>[A-Za-z]{3} \\d{1,2}, \\d{4} \\d{1,2}:\\d{2}:\\d{2}(?:am|pm))',
  '(?<timestamp>\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}Z):\\s(?<user>[^:]+):\\s(?<message>.*)',
  '(?<timestamp>\\d{1,2}/\\d{1,2}/\\d{2,4},\\s\\d{1,2}:\\d{2}\\s(?:AM|PM))\\s-\\s(?<user>[^:]+):\\s(?<message>.*)',
];