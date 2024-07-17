const mongoose = require("mongoose");
const validator = require("validator");

const centerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
});

const teacherSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Please provide a valid email"],
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: true,
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: "Passwords are not the same",
    },
  },
  role: {
    type: String,
    enum: ["teacher", "admin"],
    default: "teacher",
  },
  center: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Center",
    required: true,
  },
});

const courseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Teacher",
    required: true,
  },
  center: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Center",
    required: true,
  },
});

const quizSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  questions: [
    {
      question: {
        type: String,
        required: true,
      },
      options: [
        {
          type: String,
          required: true,
        },
      ],
      answer: {
        type: String,
        required: true,
      },
    },
  ],
});

const assignmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  deadline: {
    type: Date,
    required: true,
  },
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Quiz",
    required: true,
  },
});

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: String,
    loginName: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
    passwordConfirm: {
      type: String,
      required: true,
      validate: {
        validator: function (el) {
          return el === this.password;
        },
        message: "Passwords are not the same",
      },
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    profession: {
      type: String,
      required: true,
    },
    center: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Center",
      required: true,
    },
    courses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
    ],
    quizzes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Quiz",
      },
    ],
    assignments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Assignment",
      },
    ],
    score: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const scoreSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Quiz",
    required: true,
  },
  score: {
    type: Number,
    required: true,
  },
});

const packageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  courses: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    },
  ],
});

const Center = mongoose.model("Center", centerSchema);
const Teacher = mongoose.model("Teacher", teacherSchema);
const Course = mongoose.model("Course", courseSchema);
const Quiz = mongoose.model("Quiz", quizSchema);
const Assignment = mongoose.model("Assignment", assignmentSchema);
const User = mongoose.model("User", userSchema);
const Score = mongoose.model("Score", scoreSchema);
const Package = mongoose.model("Package", packageSchema);

module.exports = {
  Center,
  Teacher,
  Course,
  Quiz,
  Assignment,
  User,
  Score,
  Package,
};
/*
Trong đó, chúng ta đã định nghĩa schema cho các collection "Center",
"Teacher", "Course", "User", "Quiz", "Assignment", "Score" và 
"Package". Collection "Center" lưu trữ thông tin về các trung 
tâm đào tạo, bao gồm tên và địa chỉ. Collection "Teacher" 
lưu trữ thông tin về các giáo viên, bao gồm tên, email, mật khẩu,
vai trò, trung tâm mà giáo viên thuộc về. Collection "Course" 
lưu trữ thông tin về các khóa học, bao gồm tên, mô tả, giáo viên 
và trung tâm mà khóa học thuộc về. Collection "Quiz" lưu trữ 
thông tin về các bài quiz, bao gồm tên và danh sách các câu hỏi.
Collection "Assignment" lưu trữ thông tin về các bài tập, 
bao gồm tên, mô tả, thời hạn nộp và ID của bài quiz tương ứng.
Collection "User" lưu trữ thông tin về các user, bao gồm tên,
email, mật khẩu, vai trò, nghề nghiệp, trung tâm mà user 
thuộc về, các khóa học, bài quiz, bài tập và điểm số của user.
Collection "Score" lưu trữ điểm số của user trong một khóa học và một bài quiz cụ thể. 
Collection "Package" lưu trữ thông tin về các gói khóa học, 
bao gồm tên và danh sách các khóa học được bao gồm trong gói đó.*/
