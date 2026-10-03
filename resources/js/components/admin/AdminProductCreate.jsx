import React from 'react';
import ProductForm from './ProductForm.jsx';

// Adding a product or a deal. The form itself is shared with editing.
const AdminProductCreate = ({ onCancel, onSuccess }) => <ProductForm onCancel={onCancel} onSuccess={onSuccess} />;

export default AdminProductCreate;
