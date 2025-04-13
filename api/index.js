const { createCanvas, registerFont } = require("canvas");
const axios = require("axios");
const moment = require("moment-timezone");
const { parse } = require("csv-parse/sync");

// Font registration (ensure paths are correct relative to the serverless function)
registerFont(require('path').join(__dirname, './fonts/Poppins-Bold.ttf'), { family: 'Poppins', weight: 'bold' });
registerFont(require('path').join(__dirname, './fonts/Poppins-Regular.ttf'), { family: 'Poppins', weight: 'normal' });
registerFont(require('path').join(__dirname, './fonts/NotoSC-Bold.otf'), { family: 'NotoSansSC' , weight: 'bold'});
registerFont(require('path').join(__dirname, './fonts/NotoSC-Regular.otf'), { family: 'NotoSansSC' , weight: 'normal'});

const NAMES = ["Tally", "tal", "natalia", "bub", "bubby"];
const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTk9AK81OL4Ccb0zfGFs5md5WYwtaKJFw3v26RFEz0DN5OYDOSqTsoww53PRuTUBS6gFRM9Lmc-5LgA/pub?output=csv";

module.exports = async (req, res) => {
  try {
    const csvResponse = await axios.get(CSV_URL);
    const records = parse(csvResponse.data, { columns: true, skip_empty_lines: true });

    const currentEST = moment().tz("America/New_York");
    const todayMessage = records.find(row => row.date === currentEST.format("YYYY-MM-DD"))?.message || "No special message for today!";
    const randomName = NAMES[Math.floor(Math.random() * NAMES.length)];

    const width = 600, height = 800;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = ctx.fillStyle = "#000000";


      // --- Month and Year lines ---
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(40, 40);
      ctx.lineTo(width - 40, 40);
      ctx.moveTo(40, 110);
      ctx.lineTo(width - 40, 110);
      ctx.stroke();
  
      const monthMap = {
        "Jan": "一月",
        "Feb": "二月",
        "Mar": "三月",
        "Apr": "四月",
        "May": "五月",
        "Jun": "六月",
        "Jul": "七月",
        "Aug": "八月",
        "Sep": "九月",
        "Oct": "十月",
        "Nov": "十一月",
        "Dec": "十二月"
      };      
      const currentMonthEn = currentEST.format("MMM");
      const currentMonthZh = monthMap[currentMonthEn];
      ctx.font = "bold 32px Poppins";
      ctx.textBaseline = "middle";
      ctx.textAlign = "left";
      ctx.fillText(currentMonthEn.toUpperCase(), 30, 75);
      ctx.textAlign = "center";
      ctx.fillText(currentEST.format("YYYY"), width / 2, 75);
      ctx.textAlign = "right";
      ctx.font = "bold 32px NotoSansSC"; // use NotoSansSC for Chinese month
      ctx.fillText(currentMonthZh, width - 30, 75);
  
      // --- Date (massively large) ---
      ctx.font = "bold 350px Poppins";
      ctx.textAlign = "center";
      ctx.fillText(currentEST.format("D"), width / 2, 290);
  
      // --- Line below big date ---
      ctx.beginPath();
      ctx.moveTo(10, 450);
      ctx.lineTo(width - 10, 450);
      ctx.stroke();
  
      // --- Main info box dimensions ---
      const boxX = 20, boxY = 500, boxWidth = width - 40, boxHeight = 250;
      ctx.lineWidth = 3;
      ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
  
      // Padding doubled
      const padding = 20;
  
      // Horizontal lines (3 rows total)
      ctx.beginPath();
      ctx.moveTo(boxX, boxY + 80);
      ctx.lineTo(boxX + boxWidth, boxY + 80);
      ctx.moveTo(boxX, boxY + 170);
      ctx.lineTo(boxX + boxWidth * 0.5, boxY + 170);
      ctx.stroke();
  
      // Vertical line (only in bottom two rows on left side)
      ctx.beginPath();
      ctx.moveTo(boxX + boxWidth * 0.5, boxY + 80);
      ctx.lineTo(boxX + boxWidth * 0.5, boxY + boxHeight);
      ctx.stroke();
  
      // Greeting centered (top row)
      ctx.font = "bold 38px Poppins";
      ctx.textBaseline = "middle";
      ctx.fillText(`good afternoon, ${randomName}`, boxX + boxWidth / 2, boxY + 40);
  
      // Day & Chinese (middle left)
      ctx.font = "bold 28px NotoSansSC";
      const weekdayMap = {Mon:"星期一",Tue:"星期二",Wed:"星期三",Thu:"星期四",Fri:"星期五",Sat:"星期六",Sun:"星期日"};
      const dayEnZh = `${currentEST.format("ddd").toUpperCase()} | ${weekdayMap[currentEST.format("ddd")]}`;
      ctx.font = "bold 40px Poppins";
      ctx.fillText(dayEnZh, boxX + boxWidth * 0.25, boxY + 125);
  
      // Time (bottom left)
      ctx.font = "bold 40px Poppins";
      ctx.fillText(currentEST.format("h:mm A"), boxX + boxWidth * 0.25, boxY + 210);
  
      // Right side merged message (centered vertically & horizontally in large merged cell)
      const msgX = boxX + boxWidth * 0.75;
      const msgY = boxY + (boxHeight + 80) / 2; // middle of merged cell area
      const msgWidth = boxWidth * 0.45;
  
      // Robust centered text wrapping
      const wrapTextCentered = (context, text, x, y, maxWidth, lineHeight) => {
        const words = text.split(' ');
        let line = '';
        const lines = [];
        for(let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          if (context.measureText(testLine).width > maxWidth && n > 0) {
            lines.push(line.trim());
            line = words[n] + ' ';
          } else {
            line = testLine;
          }
        }
        lines.push(line.trim());
        const totalHeight = lines.length * lineHeight;
        let startY = y - totalHeight / 2 + lineHeight / 2;
        for(const l of lines) {
          context.fillText(l, x, startY);
          startY += lineHeight;
        }
      };
  
      ctx.font = "bold 30px Poppins";
      wrapTextCentered(ctx, todayMessage, msgX, msgY, msgWidth, 36);

    // After drawing finishes, send the response:
    res.statusCode = 200;
    res.setHeader('Content-Type', 'image/png');
    res.end(canvas.toBuffer('image/png'));
  } catch (error) {
    console.error("Error generating image:", error);
    res.statusCode = 500;
    res.end("Internal Server Error");
  }
};
