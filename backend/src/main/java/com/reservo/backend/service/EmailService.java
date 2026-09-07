package com.reservo.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    public void sendBookingConfirmationEmail(String toEmail, String guestName, String bookingCode, String resortName, String totalAmount) {
        String subject = "Reservo - Booking Confirmation #" + bookingCode;
        String body = """
                <html>
                <body style="font-family: 'Poppins', sans-serif; color: #3A241C; background-color: #FDFBF7; padding: 20px;">
                    <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 30px; border-radius: 12px; border: 1px solid #F7F3E9;">
                        <h2 style="color: #105B5C;">Booking Confirmed!</h2>
                        <p>Hi <strong>%s</strong>,</p>
                        <p>Thank you for choosing <strong>Reservo</strong>. Your room reservation at <strong>%s</strong> is confirmed.</p>
                        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;"/>
                        <p><strong>Booking ID:</strong> %s</p>
                        <p><strong>Total Amount:</strong> %s</p>
                        <p style="margin-top: 30px;">Reserve. Relax. Repeat.<br/><em>Team Reservo</em></p>
                    </div>
                </body>
                </html>
                """.formatted(guestName, resortName, bookingCode, totalAmount);
        
        sendHtmlEmail(toEmail, subject, body);
    }

    public void sendOtpEmail(String toEmail, String otpCode) {
        String subject = "Reservo - Verification OTP Code";
        String body = """
                <html>
                <body style="font-family: 'Poppins', sans-serif; padding: 20px;">
                    <h3>Your Reservo Verification Code</h3>
                    <h1 style="color: #105B5C; letter-spacing: 5px;">%s</h1>
                    <p>This OTP expires in 5 minutes.</p>
                </body>
                </html>
                """.formatted(otpCode);
        
        sendHtmlEmail(toEmail, subject, body);
    }

    public void sendPasswordResetOtp(String toEmail, String otpCode) {
        String subject = "Reservo - Password Reset Code";
        String body = """
                <html><body style="font-family: 'Poppins', sans-serif; padding: 20px;">
                    <h3>Reset your Reservo password</h3>
                    <h1 style="color: #105B5C; letter-spacing: 5px;">%s</h1>
                    <p>Use this code to reset your password. It expires in 5 minutes.</p>
                    <p>If you did not request this, you can safely ignore this email.</p>
                </body></html>
                """.formatted(otpCode);
        sendHtmlEmail(toEmail, subject, body);
    }

    private void sendHtmlEmail(String toEmail, String subject, String htmlBody) {
        log.info("Sending Email to: {} | Subject: {}", toEmail, subject);
        if (mailSender != null) {
            try {
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
                helper.setTo(toEmail);
                helper.setSubject(subject);
                helper.setText(htmlBody, true);
                mailSender.send(message);
                log.info("Email successfully dispatched to {}", toEmail);
            } catch (Exception e) {
                log.error("Failed to send email to {}: {}", toEmail, e.getMessage());
                log.info("Fallback: Email logged to console due to delivery failure. Body:\n{}", htmlBody);
            }
        } else {
            log.warn("JavaMailSender is not configured. Email logged to console. Body:\n{}", htmlBody);
        }
    }
    public void sendBookingCancellationEmail(
        String toEmail,
        String guestName,
        String bookingCode,
        String resortName,
        String refundAmount
) {

    String subject =
            "Reservo - Booking Cancelled #" + bookingCode;

    String body = """
            <html>
            <body style="font-family: 'Poppins', sans-serif; color: #3A241C; background-color: #FDFBF7; padding: 20px;">

                <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 30px; border-radius: 12px; border: 1px solid #F7F3E9;">

                    <h2 style="color: #105B5C;">
                        Booking Cancelled
                    </h2>

                    <p>
                        Hi <strong>%s</strong>,
                    </p>

                    <p>
                        Your booking at <strong>%s</strong>
                        has been cancelled successfully.
                    </p>

                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;"/>

                    <p>
                        <strong>Booking ID:</strong> %s
                    </p>

                    <p>
                        <strong>Refund Amount:</strong> ₹%s
                    </p>

                    <p style="margin-top: 30px;">
                        Reserve. Relax. Repeat.
                        <br/>
                        <em>Team Reservo</em>
                    </p>

                </div>

            </body>
            </html>
            """.formatted(
                    guestName,
                    resortName,
                    bookingCode,
                    refundAmount
            );

    sendHtmlEmail(
            toEmail,
            subject,
            body
    );
}
}
