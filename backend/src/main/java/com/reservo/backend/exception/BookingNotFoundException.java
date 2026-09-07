package com.reservo.backend.exception;

import org.springframework.http.HttpStatus;

public class BookingNotFoundException extends BaseException {

    public BookingNotFoundException(String message) {
        super(message, HttpStatus.NOT_FOUND);
    }

    public BookingNotFoundException(String bookingCode, boolean isCode) {
        super("Booking not found with code: " + bookingCode, HttpStatus.NOT_FOUND);
    }
}
