package com.deekshith.tgrtc.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI tgrtcOpenAPI() {

        Contact contact = new Contact()
                .name("Deekshith Bangi")
                .email("deekshithbangi1@gmail.com")
                .url("https://github.com/deekshithbangi");

        License license = new License()
                .name("MIT License")
                .url("https://opensource.org/licenses/MIT");

        Info info = new Info()
                .title("TGSRTC GTFS Transit API")
                .description("""
                        REST API for TGSRTC GTFS transit data.

                        Features:
                        • Agency Management
                        • Route Management
                        • Stop Management
                        • Trip Management
                        • Stop Time Management
                        • Nearby Stops Search
                        • Route Details
                        • Trip Schedule
                        • Next Departures
                        • Dashboard Statistics
                        """)
                .version("1.0.0")
                .contact(contact)
                .license(license);

        return new OpenAPI()
                .info(info);
    }
}