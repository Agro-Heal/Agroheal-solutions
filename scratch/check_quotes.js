
import fs from 'fs';

const content = fs.readFileSync('c:/Users/USER/Desktop/Agroheal-solutions/src/page/website/dashboard/Dashboard.tsx', 'utf8');

function checkQuotes(str) {
    const stack = [];
    for (let i = 0; i < str.length; i++) {
        const char = str[i];
        if (char === '"' || char === "'" || char === "`") {
            if (stack.length > 0 && stack[stack.length - 1] === char) {
                stack.pop();
            } else {
                stack.push(char);
            }
        }
    }
    return stack;
}

const lines = content.split('\n');
lines.forEach((line, index) => {
    const unclosed = checkQuotes(line);
    if (unclosed.length > 0) {
        // Many lines have unclosed quotes that are closed on other lines, 
        // but let's look for suspicious ones.
        if (line.includes('className=') || line.includes('`')) {
             console.log(`Line ${index + 1}: ${line.trim()}`);
             console.log(`Unclosed: ${unclosed.join(', ')}`);
        }
    }
});
