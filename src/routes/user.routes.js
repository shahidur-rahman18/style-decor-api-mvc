const express = require("express");
const { verifyJWT } = require("../middleware/auth.middleware");
const { verifyAdmin } = require("../middleware/role.middleware");
const { authLimiter } = require("../middleware/rateLimit.middleware");
const validate = require("../middleware/validate.middleware");
const { userBody, updateRoleBody } = require("../validators");
const userController = require("../controllers/user.controller");

const router = express.Router();

router.post("/user", authLimiter, validate(userBody), userController.saveOrUpdate);
router.get("/user/role", verifyJWT, userController.getRole);
router.get("/users", verifyJWT, verifyAdmin, userController.getUsers);
router.patch(
  "/update-role",
  verifyJWT,
  verifyAdmin,
  validate(updateRoleBody),
  userController.updateRole
);
module.exports = router;
