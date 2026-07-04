package com.smartkrishi.repository;

import com.smartkrishi.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    Optional<User> findByEmail(String email);
    
    Optional<User> findByPhone(String phone);
    
    Optional<User> findByEmailAndDeletedAtIsNull(String email);
    
    Boolean existsByEmail(String email);
    
    Boolean existsByPhone(String phone);
    
    @Query("SELECT u FROM User u WHERE u.email = :email AND u.deletedAt IS NULL")
    Optional<User> findActiveByEmail(@Param("email") String email);
}
