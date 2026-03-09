export interface ButtonProps {
  hierarchy?: 'primary' | 'secondary-grey' | 'secondary-color' | 'default';
  size?: 'small' | 'medium' | 'large';
  iconPosition?: 'none' | 'leading' | 'trailing';
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  iconOnClick?: () => void;
  className?: string;
  icon?: React.ReactNode;
}
