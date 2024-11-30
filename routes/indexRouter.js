const express = require("express");
const router = express.Router({ mergeParams: true });
const indexController = require("../controllers/indexController")
const { authenticate, isAdmin, checkFirstLogin, checkLockedAccount } = require("../middlewares/auth");
const upload_avatar = require("../middlewares/upload_avatar")

router.get("/", authenticate, checkLockedAccount, checkFirstLogin, indexController.viewDashBoardPage)

router.get("/profile", authenticate, checkLockedAccount, checkFirstLogin, indexController.viewUserProfile)

// Route cập nhật thông tin và avatar
router.put("/profile", authenticate, checkLockedAccount, checkFirstLogin, upload_avatar.single("avatar"), indexController.updateProfile);

module.exports = router;
