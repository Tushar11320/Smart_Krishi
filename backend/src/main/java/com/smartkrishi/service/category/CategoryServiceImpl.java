package com.smartkrishi.service.category;

import com.smartkrishi.dto.category.CategoryDTO;
import com.smartkrishi.dto.category.SubCategoryDTO;
import com.smartkrishi.entity.Category;
import com.smartkrishi.entity.SubCategory;
import com.smartkrishi.exception.ResourceNotFoundException;
import com.smartkrishi.repository.CategoryRepository;
import com.smartkrishi.repository.SubCategoryRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;
    private final SubCategoryRepository subCategoryRepository;

    @Override
    @Transactional
    public CategoryDTO createCategory(CategoryDTO categoryDTO) {
        Category category = new Category();
        category.setCategoryName(categoryDTO.getCategoryName());
        category.setDescription(categoryDTO.getDescription());
        category.setImageUrl(categoryDTO.getImageUrl());
        category.setDisplayOrder(categoryDTO.getDisplayOrder() != null ? categoryDTO.getDisplayOrder() : 0);
        category.setIsActive(categoryDTO.getIsActive() != null ? categoryDTO.getIsActive() : true);
        
        Category saved = categoryRepository.save(category);
        return mapToDTO(saved);
    }

    @Override
    public CategoryDTO getCategoryById(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", id));
        return mapToDTO(category);
    }

    @Override
    public List<CategoryDTO> getAllCategories() {
        return categoryRepository.findAllByOrderByDisplayOrderAsc().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public CategoryDTO getCategoryBySlug(String slug) {
        // Using categoryName as slug equivalent
        Category category = categoryRepository.findByCategoryName(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "name", slug));
        return mapToDTO(category);
    }

    @Override
    @Transactional
    public CategoryDTO updateCategory(Long id, CategoryDTO categoryDTO) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", id));
        
        category.setCategoryName(categoryDTO.getCategoryName());
        category.setDescription(categoryDTO.getDescription());
        category.setImageUrl(categoryDTO.getImageUrl());
        if (categoryDTO.getDisplayOrder() != null) {
            category.setDisplayOrder(categoryDTO.getDisplayOrder());
        }
        if (categoryDTO.getIsActive() != null) {
            category.setIsActive(categoryDTO.getIsActive());
        }
        
        Category updated = categoryRepository.save(category);
        return mapToDTO(updated);
    }

    @Override
    @Transactional
    public void deleteCategory(Long id) {
        if (!categoryRepository.existsById(id)) {
            throw new ResourceNotFoundException("Category", "id", id);
        }
        categoryRepository.deleteById(id);
    }

    @Override
    @Transactional
    public SubCategoryDTO createSubCategory(Long categoryId, SubCategoryDTO subCategoryDTO) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", categoryId));
        
        SubCategory subCategory = new SubCategory();
        subCategory.setCategory(category);
        subCategory.setSubcategoryName(subCategoryDTO.getSubCategoryName());
        subCategory.setDescription(subCategoryDTO.getDescription());
        subCategory.setImageUrl(subCategoryDTO.getImageUrl());
        subCategory.setDisplayOrder(subCategoryDTO.getDisplayOrder() != null ? subCategoryDTO.getDisplayOrder() : 0);
        subCategory.setIsActive(subCategoryDTO.getIsActive() != null ? subCategoryDTO.getIsActive() : true);
        
        SubCategory saved = subCategoryRepository.save(subCategory);
        return mapSubCategoryToDTO(saved);
    }

    @Override
    public List<SubCategoryDTO> getSubCategoriesByCategory(Long categoryId) {
        return subCategoryRepository.findByCategoryId(categoryId).stream()
                .map(this::mapSubCategoryToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public SubCategoryDTO getSubCategoryById(Long id) {
        SubCategory subCategory = subCategoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SubCategory", "id", id));
        return mapSubCategoryToDTO(subCategory);
    }

    @Override
    @Transactional
    public SubCategoryDTO updateSubCategory(Long id, SubCategoryDTO subCategoryDTO) {
        SubCategory subCategory = subCategoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SubCategory", "id", id));
        
        subCategory.setSubcategoryName(subCategoryDTO.getSubCategoryName());
        subCategory.setDescription(subCategoryDTO.getDescription());
        subCategory.setImageUrl(subCategoryDTO.getImageUrl());
        if (subCategoryDTO.getDisplayOrder() != null) {
            subCategory.setDisplayOrder(subCategoryDTO.getDisplayOrder());
        }
        if (subCategoryDTO.getIsActive() != null) {
            subCategory.setIsActive(subCategoryDTO.getIsActive());
        }
        
        SubCategory updated = subCategoryRepository.save(subCategory);
        return mapSubCategoryToDTO(updated);
    }

    @Override
    @Transactional
    public void deleteSubCategory(Long id) {
        if (!subCategoryRepository.existsById(id)) {
            throw new ResourceNotFoundException("SubCategory", "id", id);
        }
        subCategoryRepository.deleteById(id);
    }

    private CategoryDTO mapToDTO(Category category) {
        return CategoryDTO.builder()
                .id(category.getId())
                .categoryName(category.getCategoryName())
                .description(category.getDescription())
                .imageUrl(category.getImageUrl())
                .isActive(category.getIsActive())
                .displayOrder(category.getDisplayOrder())
                .build();
    }

    private SubCategoryDTO mapSubCategoryToDTO(SubCategory subCategory) {
        return SubCategoryDTO.builder()
                .id(subCategory.getId())
                .categoryId(subCategory.getCategory() != null ? subCategory.getCategory().getId() : null)
                .subCategoryName(subCategory.getSubcategoryName())
                .description(subCategory.getDescription())
                .imageUrl(subCategory.getImageUrl())
                .isActive(subCategory.getIsActive())
                .displayOrder(subCategory.getDisplayOrder())
                .build();
    }
}
