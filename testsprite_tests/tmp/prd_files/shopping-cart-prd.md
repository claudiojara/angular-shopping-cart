# Shopping Cart Application - Product Requirements Document

## Overview
A modern e-commerce shopping cart application built with Angular 20.3 and Angular Material, featuring signal-based state management for a responsive shopping experience.

## Features

### 1. Product Catalog
**Description:** Display a catalog of products available for purchase
- Show product grid with images, names, descriptions, prices, and categories
- Display 6 products across different categories (Electronics, Audio, Mobile, Design, Wearables, Photography)
- Each product card shows product image, name, description, price, and category chip
- "Add to Cart" button with icon for each product

**User Flow:**
1. User navigates to product list page
2. User views available products in a grid layout
3. User can add any product to cart by clicking "Add to Cart" button

### 2. Shopping Cart Management
**Description:** Manage items added to the shopping cart
- View all items in cart with product details
- Update quantities for each item
- Remove individual items from cart
- Clear entire cart
- Display running total of cart value
- Show item count in navigation badge

**User Flow:**
1. User clicks on cart icon in navigation
2. User sees list of all cart items
3. User can increment/decrement quantity using +/- buttons
4. User can remove items using remove button
5. User can clear entire cart using "Clear Cart" button
6. User sees real-time total calculation

### 3. Cart State Management
**Description:** Reactive state management using Angular signals
- Add products to cart (increment quantity if already exists)
- Remove products from cart
- Update product quantities
- Calculate total item count
- Calculate total price
- Clear all cart items

**Business Rules:**
- If product already exists in cart, increment quantity by 1
- If quantity is set to 0 or below, remove item from cart
- Total = sum of (price × quantity) for all items
- Item count = sum of all quantities

### 4. Checkout Process
**Description:** Complete purchase transaction
- Display total amount
- Show confirmation message
- Clear cart after successful checkout

**User Flow:**
1. User reviews cart items and total
2. User clicks "Checkout" button
3. System shows alert with total amount
4. Cart is cleared automatically

### 5. Navigation
**Description:** Navigate between product list and cart views
- Toolbar with app title
- Navigation links for Products and Cart
- Cart badge showing total item count
- Active route highlighting

## Technical Requirements

### Frontend Framework
- Angular 20.3 with standalone components
- TypeScript 5.9.2
- Signal-based reactive state management

### UI Framework
- Angular Material 20.2.14
- Material Design components (Cards, Buttons, Icons, Toolbar, Badge, List, Chips)
- SCSS for styling

### State Management
- Angular Signals for reactive state
- Computed signals for derived state (total, itemCount)
- Signal updates for cart operations

### Testing
- Jasmine test framework
- Karma test runner

## Data Models

### Product
- id: number
- name: string
- description: string
- price: number
- image: string (URL)
- category: string

### CartItem
- product: Product
- quantity: number

## User Experience Requirements
- Responsive design for different screen sizes
- Real-time updates when cart changes
- Visual feedback for user actions
- Clean, modern Material Design interface
- Intuitive navigation between views
