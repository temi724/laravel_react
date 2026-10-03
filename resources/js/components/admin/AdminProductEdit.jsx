import React from 'react';
import ProductForm from './ProductForm.jsx';

// Editing a product or a deal. `item` carries its `type` ('product' or 'deal').
const AdminProductEdit = ({ item, onCancel, onSuccess }) => <ProductForm item={item} onCancel={onCancel} onSuccess={onSuccess} />;

export default AdminProductEdit;
