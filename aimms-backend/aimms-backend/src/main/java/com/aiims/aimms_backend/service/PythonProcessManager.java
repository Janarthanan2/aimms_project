package com.aiims.aimms_backend.service;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.concurrent.TimeUnit;

// @Service
public class PythonProcessManager {

    private static final Logger logger = LoggerFactory.getLogger(PythonProcessManager.class);

    @Value("${app.python.enabled:false}")
    private boolean enabled;

    @Value("${app.python.executable-path}")
    private String pythonPath;

    @Value("${app.python.working-dir}")
    private String workingDir;

    @Value("${app.python.script-name}")
    private String scriptName;

    private Process pythonProcess;

    @PostConstruct
    public void startPythonService() {
        if (!enabled) {
            logger.info("Python service automation is disabled.");
            return;
        }

        try {
            logger.info("Starting Python service...");
            logger.info("Executable: {}", pythonPath);
            logger.info("Script: {}", scriptName);
            logger.info("Working Dir: {}", workingDir);

            File workDirFile = new File(workingDir);
            // Resolve relative path if needed, though ProcessBuilder handles it if CWD is
            // correct.
            // But getting canonical path helps debugging.
            if (!workDirFile.isAbsolute()) {
                workDirFile = workDirFile.getCanonicalFile();
            }

            logger.info("Resolved Working Dir: {}", workDirFile.getAbsolutePath());

            ProcessBuilder pb = new ProcessBuilder(pythonPath, scriptName);
            pb.directory(workDirFile);
            pb.redirectErrorStream(true); // Merge stderr into stdout

            pythonProcess = pb.start();

            // Consume output in a separate thread to prevent blocking
            new Thread(() -> {
                try (BufferedReader reader = new BufferedReader(
                        new InputStreamReader(pythonProcess.getInputStream()))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        logger.info("[Python] " + line);
                    }
                } catch (IOException e) {
                    logger.error("Error reading Python output", e);
                }
            }).start();

            logger.info("Python service started successfully (PID: {})", pythonProcess.pid());

        } catch (IOException e) {
            logger.error("Failed to start Python service", e);
        }
    }

    @PreDestroy
    public void stopPythonService() {
        if (pythonProcess != null && pythonProcess.isAlive()) {
            logger.info("Stopping Python service...");
            pythonProcess.destroy();
            try {
                if (!pythonProcess.waitFor(5, TimeUnit.SECONDS)) {
                    pythonProcess.destroyForcibly();
                }
                logger.info("Python service stopped.");
            } catch (InterruptedException e) {
                logger.error("Interrupted while stopping Python service", e);
                Thread.currentThread().interrupt();
            }
        }
    }
}
