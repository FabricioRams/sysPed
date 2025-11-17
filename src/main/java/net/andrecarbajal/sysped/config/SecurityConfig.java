package net.andrecarbajal.sysped.config;

import net.andrecarbajal.sysped.service.CaptchaService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public CaptchaValidationFilter captchaValidationFilter(CaptchaService captchaService) {
        return new CaptchaValidationFilter(captchaService);
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, CaptchaValidationFilter captchaValidationFilter) throws Exception {
        http
                .addFilterBefore(captchaValidationFilter, UsernamePasswordAuthenticationFilter.class)
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers("/css/**.css", "/jss/**.js").permitAll()
                        .requestMatchers("/captcha/**").permitAll()
                        .requestMatchers("/login", "/login?error=*").permitAll()
                        .requestMatchers("/ws/**", "/topic/**", "/user/**").permitAll()
                        .requestMatchers("/dashboard/**").authenticated()
                        .requestMatchers("/dashboard/staff/**").hasAnyRole("ADMINISTRADOR", "JEFE")
                        .requestMatchers("/dashboard/plate/set-active").hasAnyRole("ADMINISTRADOR", "JEFE", "COCINERO")
                        .requestMatchers("/dashboard/plate/update").hasAnyRole("ADMINISTRADOR", "JEFE")
                        .requestMatchers("/dashboard/receipt/**").hasAnyRole("ADMINISTRADOR", "JEFE", "CAJERO")
                        .requestMatchers("/").permitAll()
                        .anyRequest().authenticated()
                )
                .formLogin(form -> form
                        .loginPage("/login")
                        .failureUrl("/login?error=credentials")
                        .defaultSuccessUrl("/dashboard", true)
                        .permitAll()
                )
                .logout(logout -> logout
                        .logoutUrl("/logout")
                        .logoutSuccessUrl("/login")
                        .permitAll())
                .cors(AbstractHttpConfigurer::disable)
                .csrf(AbstractHttpConfigurer::disable)
                .httpBasic(Customizer.withDefaults());

        return http.build();
    }

    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }
}
