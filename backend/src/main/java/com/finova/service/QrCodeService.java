package com.finova.service;

import com.finova.dto.QrCodeResponse;
import com.finova.dto.ScanQrRequest;
import com.finova.dto.UserDto;

public interface QrCodeService {

    QrCodeResponse generateQrCode(Long userId);

    UserDto scanAndResolveQrCode(ScanQrRequest scanQrRequest);
}
