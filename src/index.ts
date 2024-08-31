import cors from "cors";
import express, { Request, Response } from "express";
import multer from "multer";
import os from "os";
import path from "path";
import xlsx from "xlsx";
const ExcelJS = require("exceljs");
const fs = require("fs");
const chalk = require("chalk");

import { writeFile } from "fs/promises";
import { createPostWithTitleCheck, PostResponse, PostType } from "./helpers";

const app = express();
const PORT = process.env.PORT || 9000;

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.engine("html", require("ejs").renderFile);
app.use(cors());
app.use(express.json());
app.use(express.static("assets"));

const totalCores = os.cpus().length;
console.log("CORES", totalCores);
const usableCores = Math.max(1, Math.floor(totalCores * 0.8));
console.log("USABLE CORES", usableCores);

app.post("/getList", async (req: Request, res: Response) => {
  const { url, username, password, startsAt } = req.body;
  let listOfKeyword: any;
  let successMessage: string;
  const addtlFilename = url.replace(/^https:\/\//, "").replace(/\/$/, "");

  try {
    const data = fs.readFileSync("listofkeyword.txt", "utf8");
    listOfKeyword = data.split("\n");
  } catch (err) {
    console.error(err);
  }

  const formatDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    return `${year}-${month}-${day} ${hours}-${minutes}-${seconds}`;
  };

  // Function to generate data for each row
  const generateRowData = (index: number) => {
    return [listOfKeyword[index], `not_completed`, url, username, password];
  };

  // Function to create an Excel file
  const createExcelFile = async (fileName: string) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sheet1");

    // Add columns
    worksheet.columns = [
      { header: "Name", key: "col1" },
      { header: "Status", key: "col2" },
      { header: "Url", key: "col3" },
      { header: "Username", key: "col4" },
      { header: "Password", key: "col5" },
    ];

    // Add rows
    for (let i = +startsAt - 1; i <= listOfKeyword.length - 1; i++) {
      worksheet.addRow(generateRowData(i));
    }

    // Write to file
    await workbook.xlsx.writeFile(fileName);
    successMessage = `${fileName} created successfully.`;
    console.log(successMessage);
  };

  // Function to create multiple Excel files
  const createMultipleFiles = async () => {
    const formattedDateTime = formatDateTime();
    const fileName = `list_for_${addtlFilename} ${formattedDateTime}.xlsx`;
    await createExcelFile(fileName);
  };

  // Create Excel files
  createMultipleFiles()
    .then(() => {
      res.json({
        status: 200,
        data: {},
        message: successMessage,
      });
    })
    .catch((err) => {
      res.status(500).json({ error: `Error creating files: ${err}` });
    });
});

app.post(
  "/upload",
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No file uploaded" });
        return;
      }
      const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = xlsx.utils.sheet_to_json(sheet) as PostType[];
      const chunkSize = 300;
      const chunks = [];
      for (let i = 0; i < jsonData.length; i += chunkSize) {
        chunks.push(jsonData.slice(i, i + chunkSize));
      }
      let created: PostResponse[] = [];
      let exist: PostResponse[] = [];
      const processChunk = async (chunk: PostType[], chunkIndex: number) => {
        let chunkCreated: PostResponse[] = [];
        let chunkExist: PostResponse[] = [];
        for (const item of chunk) {
          const auth = Buffer.from(
            `${item.Username}:${item.Password}`
          ).toString("base64");
          const post = await createPostWithTitleCheck(
            item,
            auth,
            jsonData.length
          );

          if (!post?.isExist) {
            chunkCreated.push(post!);
            item.Status = "completed";
          } else {
            chunkExist.push(post);
          }
        }
        created = [...created, ...chunkCreated];
        exist = [...exist, ...chunkExist];
        const newWorkbook = xlsx.utils.book_new();
        const newSheet = xlsx.utils.json_to_sheet(chunk);
        xlsx.utils.book_append_sheet(newWorkbook, newSheet, "Sheet1");
        const filePath = path.join(
          __dirname,
          "..",
          "assets",
          "xlsx",
          `updated_file_chunk_${chunkIndex + 1}.xlsx`
        );
        await writeFile(filePath, xlsx.write(newWorkbook, { type: "buffer" }));
      };
      await Promise.all(
        chunks.map((chunk, index) => processChunk(chunk, index))
      );
      res.json({
        status: 200,
        data: created,
        wpUrl: req.body.url,
        exist: exist,
        fileUrls: chunks.map(
          (_, index) => `./xlsx/updated_file_chunk_${index + 1}.xlsx`
        ),
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to process the uploaded file" });
    }
  }
);

export const errorKeyWordLog = async (post: PostType) => {
  const filePath = path.join(
    __dirname,
    "..",
    "assets",
    "error",
    "error-logs.xlsx"
  );
  // console.log("File path:", filePath);

  try {
    // console.log("wew2!");
    if (!fs.existsSync(filePath)) {
      throw new Error("File not found");
    }
    const fileBuffer = fs.readFileSync(filePath);
    // console.log("File read successfully");

    const workbook = xlsx.read(fileBuffer, { type: "buffer" });
    // console.log("Workbook read successfully");

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const data: any = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    const filteredData: any = data.filter((row: any) =>
      row.some((cell: any) => cell !== undefined && cell !== "")
    );

    const newRow = [
      post.Name,
      "not_completed",
      post.Url,
      post.Username,
      post.Password,
    ];
    filteredData.push(newRow);
    // console.log("Data after adding new row:", filteredData);

    const newSheet = xlsx.utils.aoa_to_sheet(filteredData);
    workbook.Sheets[sheetName] = newSheet;
    // console.log("Sheet updated with new data");

    const updatedFileBuffer = xlsx.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    await writeFile(filePath, updatedFileBuffer);
    // console.log("File written successfully");
  } catch (error) {
    // console.error("Error updating file:", error);
    // console.log("wew3!");
  }
};

app.get("/", function (req, res) {
  res.render("../index.html");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${chalk.green(PORT)}`);
});
