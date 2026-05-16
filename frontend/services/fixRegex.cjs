const fs = require('fs');
let content = fs.readFileSync('frontend/services/commandProcessor.ts', 'utf8');

// Find all regexes like /\b(words|with|hindi|बदलो)\b/i
// We want to remove \b from these regexes OR replace them with (?:^|\s)
// Actually, let's replace \b with (?:\b|\s|^) and (?:\b|\s|$) for any regex containing Hindi characters.
// We can use a replacer function.

content = content.replace(/\/\\b\(([^)]*[\u0900-\u097F][^)]*)\)\\b\/([a-z]*)/g, (match, p1, p2) => {
    return '/(?:^|\\s)(' + p1 + ')(?:\\s|$)/' + p2;
});

// There might be some nested parens or multiple \b. Let's just do it manually for the lines we saw.
fs.writeFileSync('frontend/services/commandProcessor.ts', content);
console.log('Done replacing Hindi regex boundaries');
