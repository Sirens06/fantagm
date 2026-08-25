import Link from "next/link";

interface ButtonProps {
    href: string;
    children?: React.ReactNode;
    variant: "primary" | "secondary" | "tertiary" | "ghost";
}

export function Button({href, children, variant} : ButtonProps){
    const baseClasses = "px-4 py-2 rounded-md font-semibold transition-colors duration-300";
    const variantClasses = {
        primary: "bg-blue-500 text-white hover:bg-blue-600",
        secondary: "bg-gray-500 text-white hover:bg-gray-600",
        tertiary: "bg-green-500 text-white hover:bg-green-600",
        ghost: "bg-transparent text-blue-500 hover:bg-blue-100",
    };

    const classes = `${baseClasses} ${variantClasses[variant]}`;
    return(
        <Link href={href} className={classes}>
            {children}
        </Link>
    )
}