package com.artlog.domain.song.entity;

import com.artlog.domain.category.entity.Category;
import com.artlog.domain.note.entity.NoteSongTag;
import com.artlog.domain.user.entity.User;
import com.artlog.global.entity.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "user_song")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class UserSong extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    // --- 연관관계 ---

    @OneToMany(mappedBy = "userSong", cascade = CascadeType.ALL, orphanRemoval = true,
            fetch = FetchType.LAZY)
    @Builder.Default
    private List<NoteSongTag> noteSongTags = new ArrayList<>();

    // --- 비즈니스 메서드 ---

    public void rename(String title) {
        this.title = title;
    }

    public void assignCategory(Category category) {
        this.category = category;
    }
}
