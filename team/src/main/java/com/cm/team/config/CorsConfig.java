package com.cm.team.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Value("${FRONTEND_URL:http://localhost:5173}")
    private String frontendUrl;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        // HTTP → HTTPS 변형도 허용 (프로덕션 HTTPS 대응)
        String httpsVariant = frontendUrl.replace("http://", "https://");

        registry.addMapping("/api/**")
                .allowedOriginPatterns(
                        "http://localhost:*",   // 개발: Vite 포트 무관하게 허용
                        frontendUrl,            // 프로덕션 HTTP
                        httpsVariant            // 프로덕션 HTTPS
                )
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .maxAge(3600);
    }
}
