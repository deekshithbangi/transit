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
        return new OpenAPI()
                .info(new Info()
                        .title("TSRTC GTFS API")
                        .description("REST API for TSRTC GTFS data including agencies, routes, stops, trips, stop times, and journey planning.")
                        .version("v1.0.0")
                        .contact(new Contact()
                                .name("Deekshith Bangi")
                                .email("deekshithbangi1@gmail.com"))
                        .license(new License()
                                .name("MIT License")));
    }
}