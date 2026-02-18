import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
    rating: number; // 0 to 5
    maxRating?: number;
    onRatingChange?: (rating: number) => void;
    readonly?: boolean;
    size?: number;
}

const StarRating: React.FC<StarRatingProps> = ({
    rating,
    maxRating = 5,
    onRatingChange,
    readonly = false,
    size = 24,
}) => {
    const handleStarClick = (index: number) => {
        if (!readonly && onRatingChange) {
            onRatingChange(index + 1);
        }
    };

    return (
        <div className="flex space-x-1">
            {[...Array(maxRating)].map((_, index) => {
                const filled = index < Math.round(rating);
                return (
                    <button
                        key={index}
                        type="button"
                        onClick={() => handleStarClick(index)}
                        disabled={readonly}
                        className={`${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform`}
                    >
                        <Star
                            size={size}
                            className={`${filled ? 'fill-yellow-400 text-yellow-400' : 'fill-transparent text-gray-300'
                                } transition-colors`}
                        />
                    </button>
                );
            })}
        </div>
    );
};

export default StarRating;
