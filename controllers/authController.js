const passport = require("passport");
const crypto = require("crypto");
const mongoose = require("mongoose");
const User = mongoose.model("User");
const promisify = require("es6-promisify");
const mail = require("../handlers/mail");
exports.login = passport.authenticate("local", {
  failureFlash: "Failed Login!",
  failureRedirect: "/login",
  successFlash: "You are now logged in!",
  successRedirect: "/"
});

exports.logout = (req, res) => {
  req.logout();
  req.flash("success", "You are now logged out!");
  res.redirect("/");
};

exports.isLoggedIn = (req, res, next) => {
  // is user authenticed?
  if (req.isAuthenticated()) {
    next(); // they logged in!
    return;
  }
  req.flash("error", "Oops! you must be logged in to do that!");
  res.redirect("/login");
};

exports.forgot = async (req, res) => {
  // 1. See if email exists
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    req.flash("error", "No account with that email exists!");
    return res.redirect("/login");
  }
  // 2. set reset tokens and expiry on their account
  user.resetPasswordToken = crypto.randomBytes(20).toString("hex");
  user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
  await user.save();
  // 3. Send them email with token!
  const resetURL = `http://${req.headers.host}/account/reset/${user.resetPasswordToken}`;
  await mail.send({
    user,
    filename: "password-reset",
    subject: "Password Reset",
    resetURL
  });

  req.flash("success", `You have been emailed a password reset link.`);
  res.redirect("/login");
  // 4. redirect to login page!
};

exports.reset = async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() }
  });
  if (!user) {
    req.flash("error", "Password reset token is invalid or has expired");
    return res.redirect("/login");
  }
  // if there's a user show the reset password form!
  res.render("reset", { title: "Reset Your Password" });
};

exports.confirmedPasswords = (req, res, next) => {
  if (req.body.password === req.body["password-confirm"]) {
    next(); // keep going!
    return;
  }
  req.flash("error", "Passwords do not match!");
  res.redirect("back");
};

exports.update = async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() }
  });
  if (!user) {
    req.flash("error", "Password reset token is invalid or has expired");
    return res.redirect("/login");
  }
  // update
  const setPassword = promisify(user.setPassword, user);
  await setPassword(req.body.password);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  const updatedUser = await user.save();
  await req.login(updatedUser);
  req.flash("success", "Your password has been reset!");
  res.redirect("/");
};
