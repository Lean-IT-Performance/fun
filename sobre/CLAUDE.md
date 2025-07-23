# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Sobre** is a web application for responsible alcohol consumption that uses scientific calculations based on the Widmark formula to estimate blood alcohol content (BAC) in real-time.

## Development Architecture

This project is designed as a **pure vanilla JavaScript application** with no build system or package manager:
- **HTML5**: Semantic structure and accessibility
- **CSS3**: Responsive styling with CSS Grid/Flexbox  
- **Vanilla JavaScript**: Business logic without frameworks
- **Local Storage**: Client-side data persistence

## Key Technical Components

### Core Algorithm
- Implements enhanced Widmark formula for BAC calculation: `BAC = (A × 0.8) / (W × r) - (β × t)`
- Factors include weight, gender, digestive state, and time elapsed
- Elimination rate calculations for sobriety predictions

### Data Models
- **User Profile**: Weight, gender, settings stored in localStorage
- **Consumption Session**: Drinks timeline with BAC calculations
- **Drinks Database**: Local catalog of alcoholic beverages with accurate alcohol content

### Application Structure
- Single Page Application architecture
- Module-based JavaScript organization
- Mobile-first responsive design

## Implementation Status

The Sobre calculator is **fully implemented and production-ready**:

- ✅ **Core Algorithm**: Enhanced Widmark formula with digestive state factors
- ✅ **User Interface**: Complete drink library, profile management, real-time calculations
- ✅ **Visualizations**: BAC timeline graphs and sobriety predictions
- ✅ **Mobile Optimization**: Responsive design with touch-friendly controls
- ✅ **Data Persistence**: LocalStorage with session management

## Development Guidelines

- No external dependencies or build tools
- Scientific accuracy is critical - validate calculations thoroughly
- Mobile-first design approach
- Store all data locally for privacy
- Include clear disclaimers about estimation limitations

## Performance Targets

- Initial load: < 2 seconds
- Interface responsiveness: < 100ms
- Total app size: < 500KB
- Browser compatibility: Chrome 60+, Firefox 55+, Safari 11+, Edge 79+

## Legal and Safety Considerations

- Include prominent disclaimers about estimation limitations
- Never suggest the app is suitable for determining driving safety
- Emphasize educational and harm reduction purposes
- Provide clear warnings about legal and safety implications