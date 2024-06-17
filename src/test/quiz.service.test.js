const nodemailer = require("nodemailer");
jest.mock("nodemailer");

const quizService = require('./quiz.service'); // Đường dẫn tới file quiz.service.js

describe('createQuiz with 100 students', () => {
  it('should send emails to 100 students', async () => {
    // Mô phỏng nodemailer
    const sendMailMock = jest.fn();
    nodemailer.createTransport.mockReturnValue({
      sendMail: sendMailMock,
    });

    // Tạo dữ liệu giả lập cho 100 học viên
    const studentIds = [];
    for (let i = 0; i < 100; i++) {
      studentIds.push(`studentId${i}`);
    }

    // Gọi hàm createQuiz với dữ liệu giả lập, bao gồm 100 học viên
    const quizData = {
      // Điền thông tin giả lập cho quizData, bao gồm studentIds với 100 ID
    };

    await quizService.createQuiz(quizData);

    // Kiểm tra xem hàm sendMail đã được gọi đúng số lần (100 lần) hay chưa
    expect(sendMailMock).toHaveBeenCalledTimes(100);

    // Kiểm tra xem hàm sendMail có được gọi với các tham số mong muốn không
    // Ví dụ kiểm tra lần gọi đầu tiên
    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: expect.any(String), // Kiểm tra xem 'to' có phải là string
        subject: expect.any(String), // Kiểm tra xem 'subject' có phải là string
        // Thêm các kiểm tra khác tùy theo nội dung email mong muốn
      }),
      expect.any(Function) // Kiểm tra xem có callback function
    );

    // Thêm các assertion khác nếu cần
  });
});