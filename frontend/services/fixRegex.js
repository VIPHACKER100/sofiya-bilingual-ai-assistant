const fs = require('fs');

let content = fs.readFileSync('frontend/services/commandProcessor.ts', 'utf8');

// We want to replace /\b(pattern)\b/flags with /(?:^|[^\p{L}\p{N}_])(pattern)(?:$|[^\p{L}\p{N}_])/flags+u
// Wait, not all \b are at the start and end of the regex, some regexes are complex like:
// /\b(volume|sound)\s+(to|set)\s+(\d+)\b/
// Instead of a single regex replace, we can replace all occurrences of \b with (?:^|[^\p{L}\p{N}_]) and (?:$|[^\p{L}\p{N}_]) but that's hard to distinguish start vs end.

// Since the main issue is Devanagari not being matched by \b, we can replace \b with (?:\b|(?<=^|[^a-zA-Z0-9_])|(?=[^a-zA-Z0-9_]|$))
// Actually, JS lookbehind requires Node 9+. We can just replace \b with (?:\W|^|$) - wait, no.
// If we replace \b with (^|\s) for the start and (\s|$) for the end, we have to change the capturing groups!
// The best robust fix for our specific case is to just change the literal words in the match statements for Hindi to not use \b.

// Let's just do a string replacement for the specific problematic ones!
content = content.replace(
  /\\b\(system status\|pc status\|computer status\|system check\|सिस्टम स्टेटस\|पीसी स्टेटस\|कंप्यूटर स्थिति\|सिस्टम चेक\)\\b/g,
  '(?:^|\\\\s)(system status|pc status|computer status|system check|सिस्टम स्टेटस|पीसी स्टेटस|कंप्यूटर स्थिति|सिस्टम चेक)(?:\\\\s|$)'
);

content = content.replace(
  /\\b\(play\|music\|song\|gaana\|bajao\|chalao\|suno\|sunao\|open\|kholo\|khola\|ओपन\|खोलो\|चलाओ\)\\b/g,
  '(play|music|song|gaana|bajao|chalao|suno|sunao|open|kholo|khola|ओपन|खोलो|चलाओ)'
);

content = content.replace(
  /\\b\(stop\|pause\|roko\|band\)\\b/g,
  '(stop|pause|roko|band)'
);

fs.writeFileSync('frontend/services/commandProcessor.ts', content);
console.log('Fixed regex boundaries');
