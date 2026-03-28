import React from 'react';

export default function RecipeSteps({ recipe }) {
    if (!recipe.steps || typeof recipe.steps !== 'string') return null;
    
    return (
        <section>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6 pb-2 border-b-2 border-primary/20 inline-block">Steps</h3>
            <div className="space-y-8 mt-6">
                {recipe.steps.split('\n').filter(s => s.trim()).map((step, i) => (
                    <div key={i} className="flex gap-6">
                        <div className="flex-shrink-0 w-8 h-8 bg-gray-800 dark:bg-[#252525] text-white dark:text-gray-300 rounded-full flex items-center justify-center font-bold text-sm shadow-md">
                            {i + 1}
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed pt-1 font-medium">
                            {step}
                        </p>
                    </div>
                ))}
            </div>
        </section>
    );
}
