package com.example.keeper.systems.auth.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CloudinaryService {

    private final Cloudinary cloudinary;

    // Hàm dùng chung để upload bất kỳ file nào lên Cloudinary (chỉ nhận file và trả về link)
    public String uploadFile(MultipartFile file, String folderName) {
        if (file.isEmpty()) {
            throw new RuntimeException("File không được để trống!");
        }
        try {
            Map uploadResult = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap("folder", folderName)
            );
            // Trả về cái link URL https của ảnh
            return uploadResult.get("secure_url").toString();
        } catch (IOException e) {
            throw new RuntimeException("Lỗi upload file lên Cloudinary: " + e.getMessage());
        }
    }
}