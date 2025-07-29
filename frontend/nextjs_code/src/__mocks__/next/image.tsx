import React from "react";

const Image = ({
	src,
	alt,
	...props
}: {
	src: string;
	alt: string;
	[key: string]: any;
}) => {
	// فقط props معتبر برای img را منتقل میکنیم
	const validProps = {
		src,
		alt,
		// اضافه کردن سایر props معتبر img در صورت نیاز
		...(props.width && { width: props.width }),
		...(props.height && { height: props.height }),
		...(props.className && { className: props.className }),
	};

	// eslint-disable-next-line @next/next/no-img-element
	return <img {...validProps} />;
};

export default Image;
