package com.example.keeper;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.List;

@SpringBootApplication
public class KeeperApplication {

	public static void main(String[] args) {
		loadEnv();
		SpringApplication.run(KeeperApplication.class, args);
	}

	private static void loadEnv() {
		try {
			java.nio.file.Path envPath = Paths.get(".env").toAbsolutePath();
			System.out.println("[ENV LOAD] Checking .env at: " + envPath);
			if (Files.exists(envPath)) {
				System.out.println("[ENV LOAD] Found .env file, reading lines...");
				List<String> lines = Files.readAllLines(envPath);
				for (String line : lines) {
					line = line.trim();
					if (line.isEmpty() || line.startsWith("#")) {
						continue;
					}
					int separator = line.indexOf("=");
					if (separator > 0) {
						String key = line.substring(0, separator).trim();
						String value = line.substring(separator + 1).trim();
						// Remove surrounding quotes if any
						if (value.startsWith("\"") && value.endsWith("\"") && value.length() >= 2) {
							value = value.substring(1, value.length() - 1);
						} else if (value.startsWith("'") && value.endsWith("'") && value.length() >= 2) {
							value = value.substring(1, value.length() - 1);
						}
						if (System.getProperty(key) == null && System.getenv(key) == null) {
							System.setProperty(key, value);
							System.out.println("[ENV LOAD] Loaded property: " + key);
						}
					}
				}
			} else {
				System.out.println("[ENV LOAD] WARNING: .env file does not exist at " + envPath);
			}
		} catch (IOException e) {
			System.err.println("[ENV LOAD] ERROR reading .env file: " + e.getMessage());
			e.printStackTrace();
		}
	}

}
