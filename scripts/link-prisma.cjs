/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require("fs");
const path = require("path");

const clientPackageDir = path.join(
  __dirname,
  "..",
  "node_modules",
  "@prisma",
  "client"
);
const generatedDir = path.join(__dirname, "..", "node_modules", ".prisma");
const clientLink = path.join(clientPackageDir, ".prisma");

function ensurePrismaLink() {
  if (!fs.existsSync(clientPackageDir) || !fs.existsSync(generatedDir)) {
    return;
  }

  const linkInfo = (() => {
    try {
      const stats = fs.lstatSync(clientLink);
      return {
        exists: true,
        isSymlink: stats.isSymbolicLink(),
        target: stats.isSymbolicLink() ? fs.readlinkSync(clientLink) : null,
      };
    } catch {
      return { exists: false, isSymlink: false, target: null };
    }
  })();

  try {
    if (linkInfo.exists && !linkInfo.isSymlink) {
      fs.rmSync(clientLink, { recursive: true, force: true });
    }

    if (
      !linkInfo.exists ||
      linkInfo.target !== "../.prisma"
    ) {
      fs.symlinkSync("../.prisma", clientLink, "dir");
    }
  } catch (error) {
    console.warn("[prisma] Unable to ensure .prisma symlink:", error.message);
  }
}

ensurePrismaLink();
