package com.smartkrishi.security;

import com.smartkrishi.entity.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.stream.Collectors;

@Data
@AllArgsConstructor
public class UserPrincipal implements UserDetails {

    private Long id;
    private String email;
    private String username;
    private String password;
    private Collection<? extends GrantedAuthority> authorities;

    public static UserPrincipal create(User user) {
        var authorities = user.getRoles().stream()
                .map(role -> {
                    String roleName = role.getRoleType().name();
                    if (!roleName.startsWith("ROLE_")) {
                        roleName = "ROLE_" + roleName;
                    }
                    return new SimpleGrantedAuthority(roleName);
                })
                .collect(Collectors.toList());

        // Grant ROLE_BUYER authority to all standard users (ROLE_USER)
        boolean hasUserRole = authorities.stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_USER"));
        if (hasUserRole) {
            authorities.add(new SimpleGrantedAuthority("ROLE_BUYER"));
        }

        return new UserPrincipal(
                user.getId(),
                user.getEmail(),
                user.getEmail(),
                user.getPasswordHash(),
                authorities
        );
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
