const mammoth = require("mammoth");
const path = require("path");
const fs = require("fs");

const filePath = path.join(__dirname, "templates", "contracts.docx");

mammoth.extractRawText({ path: filePath })
    .then(function (result) {
        const text = result.value; // The raw text
        console.log(text);

        // Save to txt for easier reading if it's long
        fs.writeFileSync(path.join(__dirname, "templates", "contracts_extracted.txt"), text);
    })
    .catch(function (err) {
        console.error(err);
    });
