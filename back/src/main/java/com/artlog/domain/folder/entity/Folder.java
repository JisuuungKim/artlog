package com.artlog.domain.folder.entity;

import com.artlog.domain.note.entity.Note;
import com.artlog.domain.user.entity.User;
import com.artlog.global.entity.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "folder")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Folder extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "is_system")     // 삭제 불가 폴더 여부
    @Builder.Default
    private Boolean isSystem = false;

    // --- 연관관계 ---

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @OneToMany(mappedBy = "folder", fetch = FetchType.LAZY)
    @Builder.Default
    private List<Note> notes = new ArrayList<>();

    // --- 비즈니스 메서드 ---

    public void rename(String name) {
        this.name = name;
    }
}
