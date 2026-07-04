package com.smartkrishi.service.category;

import com.smartkrishi.dto.category.CategoryDTO;
import com.smartkrishi.dto.category.SubCategoryDTO;

import java.util.List;

public interface CategoryService {
    CategoryDTO createCategory(CategoryDTO categoryDTO);
    CategoryDTO getCategoryById(Long id);
    List<CategoryDTO> getAllCategories();
    CategoryDTO getCategoryBySlug(String slug);
    CategoryDTO updateCategory(Long id, CategoryDTO categoryDTO);
    void deleteCategory(Long id);
    SubCategoryDTO createSubCategory(Long categoryId, SubCategoryDTO subCategoryDTO);
    List<SubCategoryDTO> getSubCategoriesByCategory(Long categoryId);
    SubCategoryDTO getSubCategoryById(Long id);
    SubCategoryDTO updateSubCategory(Long id, SubCategoryDTO subCategoryDTO);
    void deleteSubCategory(Long id);
}
