import * as fs from 'fs';
import * as path from 'path';

const filePath = '/home/ubuntu/paeds_resus_app/server/data/micro-courses-missing-fellowship.ts';

if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/50\s?mg\/kg/g, '4-5 mg/kg');
    fs.writeFileSync(filePath, content);
    console.log('Fixed Hydrocortisone in missing fellowship file.');
} else {
    console.log('Missing fellowship file not found.');
}
