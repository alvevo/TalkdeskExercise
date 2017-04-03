// Make sure we got a 'input_file' on the command line.
if (process.argv.length < 3) {
    console.log('Usage: node your_script input_file');
    process.exit(1);
}

/**
 * Loads the area codes to an array
 * @param {String} areaCodesFile
 * @return {Array} An array with all area codes
 */
function loadAreaCodes(areaCodesFile) {
    var fs = require("fs");
    var text = fs.readFileSync(areaCodesFile, "utf-8");
    var areaCodesArray = text.split("\n");
    
    return areaCodesArray;
}
var areaCodesFile = "area codes.txt";
var areaCodesArray = loadAreaCodes(areaCodesFile);
//console.log(areaCodesArray);


/**
 * Reads the file from command line argument and creates a readline interface
 * @param {String} input_file
 * @return {Object} A new ReadStream object
 */
function readFile(input_file) {
    var fs = require('fs');

    var lineReader = require('readline').createInterface({
        input: require('fs').createReadStream(input_file),
        output: process.stdout,
        terminal: true
    });
    
    return lineReader;
}
var input_file = process.argv[2];
var lineReader = readFile(input_file);


// Object that will contain the count of valid phone numbers by prefix
var validPhoneNumbers = {};

// For each line (Phone number)
lineReader.on('line', function (lineData) {
    //console.log("\n")
    //console.log('Line from file:', lineData);

    var flagPrefix00 = false;
    var flagPrefixPlus = false;
    var flagInvalidNumber = false;

    // Cannot have any letters
    if (/[a-z]/.test(lineData.toLowerCase())) {
        // Invalid phone number (e.g., 35191555K879)
        //console.log("Invalid phone number: Letters found...");
        flagInvalidNumber = true;
    }
    
    // Cannot have any symbol aside from the beginning '+' sign, and cannot have any whitespace between the '+' sign and the first digit
    if (hasSpecialCharacters(lineData)) {
        var slicedLineData = lineData.slice(1); // Line can have more '+' than the initial one
        if ( !hasSpecialCharacters(slicedLineData) && lineData.startsWith('+') && !(/^\s/.test(slicedLineData)) ) {
            flagPrefixPlus = true;
        }
        else {
            // Invalid phone number (e.g., 00+961234567, + 351961234567)
            //console.log("Invalid phone number: Has more than just the beggining '+' sign, or has whitespace between the '+' sign and the first digit...");
            flagInvalidNumber = true;
        }
    }
    // If it starts with '00', it can't start with the '+' sign
    else if(lineData.startsWith('00')) {
        flagPrefix00 = true;
    }
    
    lineData = lineData.replace(/\s/g, "");
    
    var phoneNumLength = lineData.length;

    if(flagPrefix00 === true) {
        // If it starts with '00', these two digits don't count to the MAXIMUM number of digits. This does not stand if the total number of digits is 3
        if(phoneNumLength != 3) {
            phoneNumLength -= 2;
            lineData = lineData.slice(2);
        }
    }
    else if(flagPrefixPlus === true) {
        // Can have the optional '+' character in the beginning (before any digit)
        phoneNumLength -= 1;
        lineData = lineData.slice(1);
    }

    // Has either 3 digits
    if (phoneNumLength == 3 && !flagInvalidNumber) {
        // Valid phone number without prefix
        validPhoneNumbers["No prefix"] = (validPhoneNumbers["No prefix"] || 0) + 1;
    }
    // or between 7 and 12 digits (inclusive)
    else if(phoneNumLength > 7 && phoneNumLength <= 12 && !flagInvalidNumber) {
        var prefix;
        if ( areaCodesArray.includes(lineData.slice(0,1)) ) {
            prefix = lineData.slice(0,1);
            validPhoneNumbers[prefix] = (validPhoneNumbers[prefix] || 0) + 1;
        }
        else if( areaCodesArray.includes(lineData.slice(0,2)) ) {
            prefix = lineData.slice(0,2);
            validPhoneNumbers[prefix] = (validPhoneNumbers[prefix] || 0) + 1;
        }
        else if( areaCodesArray.includes(lineData.slice(0,3)) ) {
            prefix = lineData.slice(0,3);
            validPhoneNumbers[prefix] = (validPhoneNumbers[prefix] || 0) + 1;
        }
        else {
            // Valid phone number without prefix
            validPhoneNumbers["No prefix"] = (validPhoneNumbers["No prefix"] || 0) + 1;
        }
    }
    else {
        // Invalid phone number
        //console.log("Invalid phone number: It doesn't have 3 digits, or it's not between 7 and 12 digits (inclusive)...");
        //console.log("Phone number length: " + phoneNumLength);
    }
});

// When there are no more lines (Phone numbers)
lineReader.on('close', function () {
    lineReader.output.write("\n\nFinished verifying all the phone numbers.\n");
    lineReader.output.write("Count of valid phone numbers by prefix:\n")

    var str = JSON.stringify(validPhoneNumbers, null, 4); // Indented output
    //console.log(str);
    lineReader.output.write(str);
    
    process.exit(0);
});

/**
 * Checks if provided string has any special characters
 * @param {String} str
 * @return {Boolean} The boolean result of the verification
 */
function hasSpecialCharacters(str) {
 return /[~`!#$%\^&*+=\-\[\]\\';,/{}|\\":<>\?]/g.test(str);
}
