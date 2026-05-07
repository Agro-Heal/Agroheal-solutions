
import fs from 'fs';

const content = fs.readFileSync('c:/Users/USER/Desktop/Agroheal-solutions/src/page/website/dashboard/Dashboard.tsx', 'utf8');

function checkBrackets(str) {
    const stack = [];
    for (let i = 0; i < str.length; i++) {
        const char = str[i];
        if (char === '[') stack.push('[');
        if (char === ']') {
            if (stack.length === 0) return false;
            stack.pop();
        }
    }
    return stack.length === 0;
}

const lines = content.split('\n');
lines.forEach((line, index) => {
    if (!checkBrackets(line)) {
        // Many lines have brackets that span multiple lines, 
        // but Tailwind arbitrary values like z-[60] must be on one line.
        if (line.includes('[') && line.includes('className')) {
             console.log(`Line ${index + 1}: ${line.trim()}`);
        }
    }
});
